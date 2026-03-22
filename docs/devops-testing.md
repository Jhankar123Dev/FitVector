# FitVector — DevOps and Testing Strategy

**Version:** 1.0
**Last Updated:** March 22, 2026
**Scope:** All phases — environment setup, CI/CD, deployment, testing

---

## 1. Environments

### 1.1 Environment overview

| Environment | Purpose | URL | Database | AI API |
|-------------|---------|-----|----------|--------|
| Local | Development | localhost:3000 (web), localhost:8000 (python) | Supabase local (Docker) | Claude API (dev key, low limits) |
| Staging | Pre-production testing | staging.fitvector.com | Supabase staging project | Claude API (staging key) |
| Production | Live users | fitvector.com | Supabase production project | Claude API (production key) |

### 1.2 Local development setup

**Prerequisites:**
- Node.js 20+ (via nvm)
- Python 3.11+ (via pyenv or uv)
- Docker Desktop (for Supabase local)
- pnpm (package manager)
- Git

**First-time setup:**
```bash
# Clone repo
git clone https://github.com/fitvector/fitvector.git
cd fitvector

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env.local
# Fill in API keys in .env.local

# Start Supabase local
npx supabase start
# Note the local URLs and keys printed — add to .env.local

# Run migrations
npx supabase db push

# Seed development data
npx supabase db seed

# Start Next.js dev server
pnpm --filter web dev
# → http://localhost:3000

# Start Python microservice (in separate terminal)
cd services/ai-engine
uv sync
uv run uvicorn src.main:app --reload --port 8000
# → http://localhost:8000
```

**Docker alternative (full stack):**
```yaml
# docker-compose.yml (for local development)
version: '3.8'
services:
  web:
    build: ./apps/web
    ports: ["3000:3000"]
    env_file: .env.local
    depends_on: [ai-engine, redis]
    
  ai-engine:
    build: ./services/ai-engine
    ports: ["8000:8000"]
    env_file: .env.local
    depends_on: [redis]
    
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
```

### 1.3 Environment variables management

| Environment | Storage | Access |
|-------------|---------|--------|
| Local | `.env.local` (gitignored) | Developer's machine |
| Staging | Vercel Environment Variables + Railway Variables | Deployment platform |
| Production | Vercel Environment Variables + Railway Variables | Deployment platform, restricted access |

**Secrets rotation:**
- Claude API key: rotate every 90 days
- Supabase service role key: rotate on team member departure
- Payment webhook secrets: rotate every 180 days
- Python service shared secret: rotate every 90 days

---

## 2. CI/CD pipeline

### 2.1 GitHub Actions workflow

**On pull request (`ci.yml`):**
```yaml
name: CI
on:
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter web lint
      - run: pnpm --filter web typecheck

  test-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter web test

  test-python:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v3
      - run: cd services/ai-engine && uv sync
      - run: cd services/ai-engine && uv run pytest tests/ -v

  check-migrations:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
      - run: supabase db lint
```

**On merge to main (`deploy.yml`):**
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: --prod

  deploy-python:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: ai-engine

  run-migrations:
    runs-on: ubuntu-latest
    needs: [deploy-web]
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
      - run: supabase db push --linked
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

### 2.2 Deployment strategy

| Service | Platform | Deploy method | Rollback |
|---------|----------|--------------|----------|
| Next.js web app | Vercel | Auto on push to main | Instant rollback via Vercel dashboard |
| Python microservice | Railway | Auto on push to main | Previous deployment via Railway dashboard |
| Database migrations | Supabase | CLI push after deploy | Manual rollback migration |
| Chrome extension | Chrome Web Store | Manual upload | Previous version auto-available |

**Deployment order (when both services change):**
1. Run database migrations first (if any)
2. Deploy Python microservice (backward-compatible API changes)
3. Deploy Next.js app (consumes new API features)
4. Verify health checks pass on both services
5. If health checks fail → rollback in reverse order

### 2.3 Branch strategy

```
main (production)
  ↑ merge
develop (staging)
  ↑ merge
feature/xxx (development)
```

- `feature/*` branches created from `develop`
- PR to `develop` → runs CI → code review → merge → auto-deploys to staging
- PR from `develop` to `main` → runs CI → manual approval → merge → auto-deploys to production
- Hotfix: create `hotfix/*` branch from `main`, PR directly to `main`

---

## 3. Infrastructure as code

### 3.1 Vercel configuration

```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "pnpm --filter web build",
  "outputDirectory": "apps/web/.next",
  "installCommand": "pnpm install --frozen-lockfile",
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ],
  "rewrites": [
    { "source": "/sitemap.xml", "destination": "/api/sitemap" }
  ]
}
```

### 3.2 Railway configuration

```toml
# railway.toml (for Python service)
[build]
builder = "dockerfile"
dockerfilePath = "services/ai-engine/Dockerfile"

[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 30
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```

### 3.3 Python Dockerfile

```dockerfile
FROM python:3.11-slim

# Install Tectonic (LaTeX compiler) and system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl build-essential \
    && curl -sSL https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%400.15.0/tectonic-0.15.0-x86_64-unknown-linux-gnu.tar.gz \
    | tar xz -C /usr/local/bin \
    && apt-get purge -y curl build-essential \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY services/ai-engine/pyproject.toml .
RUN pip install uv && uv sync --no-dev

# Copy source
COPY services/ai-engine/src ./src

EXPOSE 8000
CMD ["uv", "run", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 4. Monitoring and alerting

### 4.1 Health checks

**Next.js:** `GET /api/health`
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-03-22T10:00:00Z"
}
```

**Python:** `GET /health`
```json
{
  "status": "ok",
  "version": "1.0.0",
  "uptime_seconds": 86400,
  "claude_api": "reachable",
  "redis": "connected"
}
```

**Monitored by:** Better Stack (free tier — checks every 3 minutes)
**Alert channels:** Email + Slack

### 4.2 Error tracking (Sentry)

**Configuration:**
- Next.js: `@sentry/nextjs` package, source maps uploaded on deploy
- Python: `sentry-sdk[fastapi]` package
- Alert rules:
  - New error type → immediate alert
  - Error spike (10+ in 5 min) → immediate alert
  - Unhandled exception → immediate alert

**What to track:**
- All unhandled exceptions
- Claude API errors (rate limits, timeouts, content policy)
- Scraping failures (per source)
- Payment webhook failures
- PDF generation failures

**What NOT to track:**
- 401 Unauthorized (expected for unauthenticated requests)
- 429 plan limit exceeded (expected behavior)
- 404 Not Found (unless spike)

### 4.3 Application metrics (PostHog)

**Key events to track:**

| Event | Properties | Purpose |
|-------|-----------|---------|
| `user_signed_up` | auth_provider, referral_source | Acquisition funnel |
| `onboarding_completed` | steps_completed, time_to_complete | Activation |
| `resume_uploaded` | file_type, file_size | Activation |
| `job_search` | query, location, results_count | Core engagement |
| `resume_tailored` | job_id, template, generation_time | Core value delivery |
| `cold_email_generated` | job_id, was_copied | Core value delivery |
| `linkedin_msg_generated` | job_id, type, was_copied | Feature usage |
| `application_tracked` | source, status | Retention signal |
| `plan_upgraded` | from_tier, to_tier, billing_cycle | Revenue |
| `plan_cancelled` | tier, reason | Churn analysis |
| `plan_limit_hit` | action_type, tier | Upgrade triggers |
| `job_alert_clicked` | match_score | Re-engagement |

**Funnels to monitor:**
1. Signup → Onboarding complete → First job search → First resume tailor → First application tracked
2. Free user → Hits limit → Views pricing → Starts checkout → Payment success
3. Job alert email received → Clicked → Viewed job → Tailored resume → Applied

### 4.4 Performance monitoring

**Vercel Analytics (built-in):**
- Core Web Vitals: LCP, FID, CLS
- Server function duration
- Edge function duration

**Custom tracking:**
- AI generation latency (resume tailor, cold email, gap analysis) — logged to PostHog
- Scraping success rate per source — logged to structured logs
- PDF compilation time — logged to structured logs

**Performance budgets:**
| Metric | Target | Alert threshold |
|--------|--------|-----------------|
| LCP (landing page) | < 1.5s | > 2.5s |
| LCP (dashboard) | < 2.0s | > 3.0s |
| Resume tailor (end-to-end) | < 15s | > 25s |
| Job search (cached) | < 3s | > 5s |
| Job search (fresh scrape) | < 8s | > 15s |
| Cold email generation | < 5s | > 10s |
| API P95 latency | < 500ms | > 1000ms |

---

## 5. Testing strategy

### 5.1 Testing pyramid

```
         ╱╲
        ╱ E2E ╲         5-10 critical flows (Playwright)
       ╱────────╲
      ╱Integration╲     30-50 API route tests (Vitest)
     ╱──────────────╲
    ╱  Unit tests     ╲  100+ component and utility tests (Vitest)
   ╱────────────────────╲
```

### 5.2 What to test and what not to test

**Always test (unit):**
- Plan limit enforcement logic
- Score calibration functions (similarity_to_score, score_to_bucket)
- Job deduplication logic
- Zod validation schemas
- Utility functions (formatDate, formatSalary, etc.)
- Resume parsing JSON schema validation

**Always test (integration):**
- All API routes: correct response shape, auth enforcement, plan limits
- Database queries: correct data returned, RLS enforced
- Usage tracking: counters increment correctly, reset on month change
- Payment webhook handlers: plan updates correctly on payment success/failure

**Always test (E2E):**
- Complete signup → onboarding → first job search flow
- Resume upload → parse → tailor → download flow
- Application tracker: create → drag-and-drop → update → archive
- Plan upgrade: free → select Pro → payment → limits expanded
- Mobile responsive: core flows work on 375px viewport

**Don't test (not worth the maintenance cost for MVP):**
- Claude API response quality (AI output varies — test the pipeline, not the content)
- Scraping results (external dependency — mock in tests)
- PDF rendering pixel accuracy (visual regression testing is overkill for MVP)
- Third-party OAuth flows (mock the auth provider)

### 5.3 Test setup

**Vitest (unit + integration):**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',          // For component tests
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.test.ts', '**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: ['node_modules/', 'tests/', '**/*.d.ts'],
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

**Test utilities:**
```typescript
// tests/setup.ts
import { vi } from 'vitest';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
    auth: {
      getSession: vi.fn(),
    },
  },
}));

// Mock Python service client
vi.mock('@/lib/python-client', () => ({
  pythonClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));
```

**Playwright (E2E):**
```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop-chrome', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: 'pnpm --filter web dev',
    port: 3000,
    reuseExistingServer: true,
  },
});
```

**Python tests (pytest):**
```python
# services/ai-engine/tests/conftest.py
import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient
from src.main import app

@pytest.fixture
async def client():
    async with AsyncClient(app=app, base_url="http://test") as c:
        c.headers["X-Internal-Key"] = "test-secret"
        yield c

@pytest.fixture
def mock_claude():
    with patch("src.services.ai_service.anthropic_client") as mock:
        mock.messages.create = AsyncMock(return_value=MockResponse(
            content=[MockContent(text='{"subject": "Test", "body": "Test email body"}')]
        ))
        yield mock

@pytest.fixture
def mock_jobspy():
    with patch("src.services.scraper_service.scrape_jobs") as mock:
        mock.return_value = SAMPLE_JOBS_DATAFRAME
        yield mock
```

### 5.4 Test examples

**Unit test — plan limits:**
```typescript
// tests/unit/plan-limits.test.ts
import { describe, it, expect } from 'vitest';
import { checkLimit, PLAN_LIMITS } from '@/lib/plan-limits';

describe('plan limits', () => {
  it('free user cannot tailor more than 2 resumes per month', () => {
    const result = checkLimit('free', 'resume_tailor', 2);
    expect(result.allowed).toBe(false);
    expect(result.message).toContain('Upgrade');
  });

  it('pro user can tailor up to 50 resumes', () => {
    const result = checkLimit('pro', 'resume_tailor', 49);
    expect(result.allowed).toBe(true);
  });

  it('elite user has unlimited tailoring', () => {
    const result = checkLimit('elite', 'resume_tailor', 999);
    expect(result.allowed).toBe(true);
  });
});
```

**Integration test — job search API:**
```typescript
// tests/integration/jobs-search.test.ts
import { describe, it, expect, vi } from 'vitest';

describe('GET /api/jobs/search', () => {
  it('returns 401 without auth', async () => {
    const res = await fetch('/api/jobs/search?role=developer');
    expect(res.status).toBe(401);
  });

  it('returns jobs with correct shape', async () => {
    const res = await authenticatedFetch('/api/jobs/search?role=developer&location=bangalore');
    const data = await res.json();
    
    expect(res.status).toBe(200);
    expect(data.data.jobs).toBeInstanceOf(Array);
    expect(data.data.jobs[0]).toHaveProperty('title');
    expect(data.data.jobs[0]).toHaveProperty('companyName');
    expect(data.data.jobs[0]).toHaveProperty('matchScore');
  });

  it('enforces daily search limit for free users', async () => {
    // Simulate 3 searches (free limit)
    for (let i = 0; i < 3; i++) {
      await authenticatedFetch('/api/jobs/search?role=developer', { user: freeUser });
    }
    // 4th search should be blocked
    const res = await authenticatedFetch('/api/jobs/search?role=developer', { user: freeUser });
    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.upgrade).toBe(true);
  });
});
```

**E2E test — onboarding flow:**
```typescript
// tests/e2e/onboarding.spec.ts
import { test, expect } from '@playwright/test';

test('new user completes onboarding', async ({ page }) => {
  // Sign up
  await page.goto('/signup');
  await page.getByRole('button', { name: 'Continue with Google' }).click();
  // Mock OAuth callback...
  
  // Onboarding step 1
  await expect(page.getByText('Tell us about yourself')).toBeVisible();
  await page.getByLabel('Current status').selectOption('working');
  await page.getByLabel('Current role').fill('Frontend Developer');
  await page.getByRole('button', { name: 'Next' }).click();
  
  // Step 2
  await page.getByLabel('Target role').fill('Senior Frontend Developer');
  await page.getByRole('button', { name: 'Next' }).click();
  
  // Step 3
  await page.getByLabel('Location').fill('Bangalore');
  await page.getByRole('button', { name: 'Next' }).click();
  
  // Step 4 — skip resume upload
  await page.getByRole('button', { name: 'Skip for now' }).click();
  
  // Should land on dashboard
  await expect(page).toHaveURL('/dashboard');
  await expect(page.getByText('Welcome')).toBeVisible();
});
```

### 5.5 Coverage targets

| Layer | Coverage target | Enforced |
|-------|----------------|----------|
| Unit tests | 80% on utility functions and business logic | Yes — CI fails below 70% |
| Integration tests | All API routes covered (happy path + auth + limits) | Yes — checklist in PR template |
| E2E tests | 5 critical flows covered | No — manual review |
| Python unit tests | 70% on services layer | Yes — CI fails below 60% |

---

## 6. Incident response

### 6.1 Severity levels

| Level | Description | Response time | Example |
|-------|------------|---------------|---------|
| P0 | Service completely down | 15 minutes | Database unreachable, deployment crash |
| P1 | Core feature broken | 1 hour | AI resume tailoring failing, job search returning 0 results |
| P2 | Non-core feature broken | 4 hours | Analytics dashboard empty, email alerts not sending |
| P3 | Minor issue | 24 hours | Styling bug, non-blocking error in logs |

### 6.2 Incident checklist
1. Acknowledge the alert
2. Check Sentry for error details
3. Check Vercel/Railway deployment logs
4. Check Supabase health dashboard
5. If deployment-related → rollback to previous version
6. If data-related → check recent migrations
7. If external API → check Claude/Hunter/payment provider status pages
8. Communicate status (if user-facing) via Twitter/status page
9. Post-mortem for P0/P1 incidents (within 48 hours)

---

*This document covers the complete operational setup for FitVector. Follow these practices from day one — retrofitting DevOps and testing into an existing codebase is significantly harder than building it in from the start.*
