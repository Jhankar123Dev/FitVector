/**
 * setup/employer.setup.ts
 *
 * Authenticates as the test Employer via direct NextAuth API calls (no UI).
 * Mirrors seeker.setup.ts — faster and immune to UI/CSRF timing issues.
 *
 * Credentials (employer seed user):
 *   Email    : employer_1@seed.fitvector.dev
 *   Password : jhankar123
 */

import { test as setup } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const AUTH_FILE = path.join(__dirname, '../.auth/employer.json');
const BASE_URL = 'http://localhost:3000';

setup('authenticate as test employer', async ({ page }) => {
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

  // Step 1: get CSRF token
  const csrfRes = await page.request.get(`${BASE_URL}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json();

  // Step 2: POST credentials directly to NextAuth
  await page.request.post(`${BASE_URL}/api/auth/callback/credentials`, {
    form: {
      csrfToken,
      email: 'employer_1@seed.fitvector.dev',
      password: 'jhankar123',
      role: 'employer',
      callbackUrl: `${BASE_URL}/employer`,
      json: 'true',
    },
  });

  // Step 3: verify session was created
  const sessionRes = await page.request.get(`${BASE_URL}/api/auth/session`);
  const session = await sessionRes.json();

  if (!session?.user?.email) {
    throw new Error(
      `Auth failed — employer credentials rejected by NextAuth.\n` +
      `Session response: ${JSON.stringify(session)}\n` +
      `Make sure employer_1@seed.fitvector.dev exists with role=employer and password jhankar123.\n` +
      `Run: pnpm --filter web seed:test-users`
    );
  }

  console.log(`✅ Signed in as: ${session.user.email} (role: ${session.user.role})`);

  // Step 4: persist cookies for all employer specs
  await page.context().storageState({ path: AUTH_FILE });
  console.log(`✅ Employer auth state cached → ${AUTH_FILE}`);
});
