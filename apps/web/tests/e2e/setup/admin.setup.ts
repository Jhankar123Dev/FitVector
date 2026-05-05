/**
 * setup/admin.setup.ts
 *
 * Authenticates as the test Superadmin via direct NextAuth API calls (no UI).
 * Mirrors seeker.setup.ts — faster and immune to UI/CSRF timing issues.
 *
 * Credentials (superadmin seed user):
 *   Email    : superadmin@seed.fitvector.dev
 *   Password : jhankar123
 */

import { test as setup } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const AUTH_FILE = path.join(__dirname, '../.auth/admin.json');
const BASE_URL = 'http://localhost:3000';

setup('authenticate as test admin', async ({ page }) => {
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

  // Step 1: get CSRF token
  const csrfRes = await page.request.get(`${BASE_URL}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json();

  // Step 2: POST credentials directly to NextAuth
  // Superadmins bypass the role-toggle check server-side — send role=seeker,
  // the authorize() callback resolves the real role from the DB.
  await page.request.post(`${BASE_URL}/api/auth/callback/credentials`, {
    form: {
      csrfToken,
      email: 'superadmin@seed.fitvector.dev',
      password: 'jhankar123',
      role: 'seeker',
      callbackUrl: `${BASE_URL}/admin`,
      json: 'true',
    },
  });

  // Step 3: verify session was created
  const sessionRes = await page.request.get(`${BASE_URL}/api/auth/session`);
  const session = await sessionRes.json();

  if (!session?.user?.email) {
    throw new Error(
      `Auth failed — admin credentials rejected by NextAuth.\n` +
      `Session response: ${JSON.stringify(session)}\n` +
      `Make sure superadmin@seed.fitvector.dev exists with role=superadmin and password jhankar123.\n` +
      `Run: pnpm --filter web seed:test-users`
    );
  }

  console.log(`✅ Signed in as: ${session.user.email} (role: ${session.user.role})`);

  // Step 4: persist cookies for all admin specs
  await page.context().storageState({ path: AUTH_FILE });
  console.log(`✅ Admin auth state cached → ${AUTH_FILE}`);
});
