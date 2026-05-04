/**
 * setup/employer.setup.ts
 *
 * Logs in as the test Employer via the real NextAuth Credentials flow and
 * persists the resulting cookies to tests/e2e/.auth/employer.json.
 *
 * Every spec in the "employer" Playwright project consumes this file via
 * `storageState` so tests start pre-authenticated.
 *
 * Credentials (employer seed user):
 *   Email    : employer_1@seed.fitvector.dev
 *   Password : jhankar123
 */

import { test as setup, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const AUTH_FILE = path.join(__dirname, '../.auth/employer.json');

setup('authenticate as test employer', async ({ page }) => {
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

  await page.goto('/login');
  await expect(page).toHaveURL('/login');

  // The employer tab renders as "Recruiter" in the UI (Building2 icon + label)
  // NOT "Employer" — this sends role="employer" to the NextAuth credentials provider.
  await page.getByRole('button', { name: /Recruiter/i }).click();

  await page.getByLabel('Email').fill('employer_1@seed.fitvector.dev');
  await page.getByLabel('Password').fill('jhankar123');

  await page.getByRole('button', { name: 'Sign In' }).click();

  // Employers land on /employer (onboarding done) or /employer/onboarding (first time).
  await page.waitForURL(
    (url) => !url.pathname.includes('/login'),
    { timeout: 20_000 },
  );

  await expect(
    page.locator('.text-destructive').filter({ hasText: /Invalid|No recruiter/i }),
  ).not.toBeVisible();

  await page.context().storageState({ path: AUTH_FILE });
  console.log(`✅ Employer auth state cached → ${AUTH_FILE}`);
});
