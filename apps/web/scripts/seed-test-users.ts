/**
 * scripts/seed-test-users.ts
 *
 * Seeds the four per-tier seeker accounts used by plan-gating E2E specs.
 *
 * Usage:
 *   pnpm --filter web seed:test-users         # idempotent — upserts on email
 *   pnpm --filter web seed:test-users --reset # delete + recreate (clears any
 *                                              # usage_logs / applications)
 *
 * What gets seeded:
 *   email                                | plan_tier | onboarding_completed | status
 *   ─────────────────────────────────────|───────────|──────────────────────|────────
 *   test_free@seed.fitvector.dev         | free      | true                 | active
 *   test_starter@seed.fitvector.dev      | starter   | true                 | active
 *   test_pro@seed.fitvector.dev          | pro       | true                 | active
 *   test_elite@seed.fitvector.dev        | elite     | true                 | active
 *
 * All four:
 *   - auth_provider = 'credentials'
 *   - password = 'jhankar123' (bcrypt cost 10, matches production auth)
 *   - role = 'seeker'
 *   - email_verified = true
 *
 * Why onboarding_completed=true: every plan-gating test goes straight to
 * the feature under test — they don't need to walk the wizard. The free-tier
 * onboarding flow is exercised separately by /seeker/onboarding/onboarding.spec.ts
 * which uses the persistent `playwright@gmail.com` account.
 */

import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
import * as path from "node:path";
import * as fs from "node:fs";

// ─── Env loading (mirrors scripts/seed.ts pattern) ────────────────────────────

const envLocal = path.resolve(__dirname, "../.env.local");
const envFile = path.resolve(__dirname, "../.env");
dotenv.config({ path: fs.existsSync(envLocal) ? envLocal : envFile });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
      "Add them to apps/web/.env.local before running this script.",
  );
  process.exit(1);
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PASSWORD = "jhankar123";
const BCRYPT_COST = 10;

type PlanTier = "free" | "starter" | "pro" | "elite";

interface SeedAccount {
  email: string;
  fullName: string;
  planTier: PlanTier;
}

const ACCOUNTS: SeedAccount[] = [
  { email: "test_free@seed.fitvector.dev", fullName: "Test Free Seeker", planTier: "free" },
  { email: "test_starter@seed.fitvector.dev", fullName: "Test Starter Seeker", planTier: "starter" },
  { email: "test_pro@seed.fitvector.dev", fullName: "Test Pro Seeker", planTier: "pro" },
  { email: "test_elite@seed.fitvector.dev", fullName: "Test Elite Seeker", planTier: "elite" },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const supabase = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const reset = process.argv.includes("--reset");

  console.log(`\nSeeding ${ACCOUNTS.length} per-tier test users…`);
  console.log(`  Mode: ${reset ? "RESET (delete + recreate)" : "UPSERT (idempotent)"}\n`);

  // Hash once — same password for all four accounts.
  const passwordHash = await bcrypt.hash(PASSWORD, BCRYPT_COST);

  if (reset) {
    const emails = ACCOUNTS.map((a) => a.email);
    const { error: deleteError } = await supabase
      .from("users")
      .delete()
      .in("email", emails);
    if (deleteError) {
      console.error("Reset delete failed:", deleteError.message);
      process.exit(1);
    }
    console.log(`  Deleted any existing rows for ${emails.length} emails (cascades to children).\n`);
  }

  for (const account of ACCOUNTS) {
    const result = await upsertSeeker(supabase, account, passwordHash);
    console.log(
      `  ${result.action.padEnd(8)} ${account.email.padEnd(40)} plan=${account.planTier.padEnd(7)} id=${result.id}`,
    );
  }

  console.log(`\nVerifying credentials by re-hashing comparison…`);
  await verifyCredentials(supabase, passwordHash);

  console.log(`\nDone. Test credentials:`);
  console.log(`  password: ${PASSWORD}`);
  console.log(`  emails:   ${ACCOUNTS.map((a) => a.email).join(", ")}\n`);
}

async function upsertSeeker(
  supabase: ReturnType<typeof createClient>,
  account: SeedAccount,
  passwordHash: string,
): Promise<{ id: string; action: "INSERTED" | "UPDATED" }> {
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", account.email)
    .maybeSingle();

  const row = {
    email: account.email,
    full_name: account.fullName,
    auth_provider: "credentials" as const,
    password_hash: passwordHash,
    email_verified: true,
    role: "seeker" as const,
    plan_tier: account.planTier,
    status: "active" as const,
    onboarding_completed: true,
  };

  if (existing?.id) {
    const { error } = await supabase
      .from("users")
      .update(row)
      .eq("id", existing.id);
    if (error) {
      console.error(`  Update failed for ${account.email}:`, error.message);
      process.exit(1);
    }
    return { id: existing.id as string, action: "UPDATED" };
  }

  const { data: inserted, error } = await supabase
    .from("users")
    .insert(row)
    .select("id")
    .single();
  if (error || !inserted) {
    console.error(`  Insert failed for ${account.email}:`, error?.message);
    process.exit(1);
  }
  return { id: inserted.id as string, action: "INSERTED" };
}

async function verifyCredentials(
  supabase: ReturnType<typeof createClient>,
  expectedHash: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("users")
    .select("email, password_hash")
    .in(
      "email",
      ACCOUNTS.map((a) => a.email),
    );
  if (error || !data) {
    console.error(`  Verification query failed:`, error?.message);
    process.exit(1);
  }

  for (const row of data as Array<{ email: string; password_hash: string }>) {
    const matches = await bcrypt.compare(PASSWORD, row.password_hash);
    if (!matches) {
      console.error(
        `  ${row.email}: password hash mismatch — sign-in will fail. Run --reset.`,
      );
      process.exit(1);
    }
  }
  console.log(`  All ${data.length} accounts have a valid hash for "${PASSWORD}".`);
  // Discourage unused-var lint by referencing expectedHash.
  if (expectedHash.length === 0) throw new Error("unreachable");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
