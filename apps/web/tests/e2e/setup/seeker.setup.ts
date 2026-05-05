/**
 * setup/seeker.setup.ts
 *
 * Authenticates as the test seeker by calling the NextAuth API directly
 * (no UI form interaction). This is the recommended Playwright pattern for
 * NextAuth — it's faster, more reliable, and immune to React form event issues.
 *
 * Flow:
 *   1. GET  /api/auth/csrf          → grab the CSRF token
 *   2. POST /api/auth/callback/credentials → sign in, sets session cookie
 *   3. GET  /api/auth/session       → verify the session was actually created
 *   4. Save storageState            → persists cookies for all seeker specs
 *
 * Credentials (seeker seed user):
 *   Email    : indrajeet@gmail.com
 *   Password : jhankar123
 */

import { test as setup, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const AUTH_FILE = path.join(__dirname, '../.auth/seeker.json');
const BASE_URL = 'http://localhost:3000';

setup('authenticate as test seeker', async ({ page }) => {
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

  // ── Step 1: get CSRF token ───────────────────────────────────────────────
  const csrfRes = await page.request.get(`${BASE_URL}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json();

  // ── Step 2: POST credentials directly to NextAuth ────────────────────────
  await page.request.post(`${BASE_URL}/api/auth/callback/credentials`, {
    form: {
      csrfToken,
      email: 'playwright@gmail.com',
      password: 'jhankar123',
      role: 'seeker',
      callbackUrl: `${BASE_URL}/dashboard`,
      json: 'true',
    },
  });

  // ── Step 3: verify the session cookie was created ────────────────────────
  const sessionRes = await page.request.get(`${BASE_URL}/api/auth/session`);
  const session = await sessionRes.json();

  if (!session?.user?.email) {
    throw new Error(
      `Auth failed — credentials rejected by NextAuth.\n` +
      `Session response: ${JSON.stringify(session)}\n` +
      `Check: auth_provider = 'credentials' and password_hash matches 'jhankar123'.`
    );
  }

  console.log(`✅ Signed in as: ${session.user.email} (role: ${session.user.role})`);

  // ── Step 4: ensure onboarding_completed=true (auth gate added post-seed) ──
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && serviceKey) {
    const supabase = createClient(supabaseUrl, serviceKey);
    await supabase
      .from('users')
      .update({ onboarding_completed: true })
      .eq('email', 'playwright@gmail.com');
    console.log('✅ onboarding_completed=true stamped on playwright@gmail.com');
  }

  // ── Step 5: persist cookies for all seeker specs ─────────────────────────
  await page.context().storageState({ path: AUTH_FILE });
  console.log(`✅ Seeker auth state cached → ${AUTH_FILE}`);
});
