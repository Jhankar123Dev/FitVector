/**
 * setup/admin.setup.ts
 *
 * Logs in as the test Superadmin via the real NextAuth Credentials flow and
 * persists the resulting cookies to tests/e2e/.auth/admin.json.
 *
 * Every spec in the "admin" Playwright project consumes this file via
 * `storageState` so tests start pre-authenticated.
 *
 * Credentials (superadmin seed user):
 *   Email    : superadmin@seed.fitvector.dev
 *   Password : jhankar123
 *
 * Auth note: the NextAuth authorize() callback bypasses the role-toggle check
 * for superadmins ("Superadmins can log in without a role toggle match"), so
 * we do NOT need to click the Recruiter tab — the default Job Seeker tab is
 * fine and the server still resolves the correct role from the DB.
 * After login, NextAuth redirects superadmins to /admin.
 */

import { test as setup, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const AUTH_FILE = path.join(__dirname, '../.auth/admin.json');

setup('authenticate as test admin', async ({ page }) => {
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

  await page.goto('/login');
  await expect(page).toHaveURL('/login');

  // No tab click needed — superadmins bypass the role-toggle check server-side.
  // The default "Job Seeker" tab is active; the server resolves role = "superadmin"
  // directly from the DB regardless of what the UI toggle sends.
  await page.getByLabel('Email').fill('superadmin@seed.fitvector.dev');
  await page.getByLabel('Password').fill('jhankar123');

  await page.getByRole('button', { name: 'Sign In' }).click();

  // Superadmins are redirected to /admin by the session callback in auth.ts
  await page.waitForURL(
    (url) => !url.pathname.includes('/login'),
    { timeout: 20_000 },
  );

  await expect(
    page.locator('.text-destructive').filter({ hasText: /Invalid|No recruiter/i }),
  ).not.toBeVisible();

  await page.context().storageState({ path: AUTH_FILE });
  console.log(`✅ Admin auth state cached → ${AUTH_FILE}`);
});
