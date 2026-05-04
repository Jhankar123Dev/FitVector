# FitVector Pro — UI/UX Redesign Plan

> **Status:** Locked — awaiting execution approval
> **Owner:** Engineering
> **Parent branch:** `feat/new-ui-ux`
> **Design law:** `/DESIGN.md` (project root)
> **Last revised:** 2026-04-27

---

## 0. Why This Plan Exists

The codebase currently looks "AI vibe-coded": generic shadcn defaults, purple `#6c5ce7` brand color masquerading as professional, Inter font, no design coherence. The product is a dual-sided AI-powered job marketplace serving:

- **Employers (B2B):** analytical, risk-averse, judging credibility in seconds
- **Job Seekers (B2C):** anxious, hopeful, needing momentum and trust

This redesign rebuilds the visual foundation from the bottom up with a CSS-variable-driven design system, so future redesigns become a one-file change instead of a 300-file diff.

---

## 1. Locked Decisions

| Topic | Decision |
|-------|---------|
| Design language | Hybrid: Stripe's light-mode structure + Linear's data density patterns |
| Primary palette | Blue `#0369A1` (interactive) + Navy `#0C4A6E` (authority) + Green `#22C55E` (CTA only) |
| Banned colors | All purple/indigo (`#5e6ad2`, `#6c5ce7`, `#533afd`, `#6366f1`) |
| Font | Plus Jakarta Sans (300/400/500/600/700/800) — replaces Inter |
| Color architecture | 3-layer CSS variables (primitives → semantic → Tailwind utilities) |
| Dark mode | Slate-warm-dark `#0F172A` / `#1E293B` — required from day one, available on every page |
| Dark mode trigger | System preference + manual toggle (settings) — saved to localStorage + cookie for SSR |
| Dark mode brand shift | Brand blue lightens to `#38BDF8` (sky-400) in dark mode for contrast |
| Theme library | `next-themes` (new dependency) |
| Token naming | Hybrid — semantic tokens (`--primary`, `--background`) + brand scales (`--brand-50..950`, `--accent-50..900`) |
| Responsive strategy | Mobile-first, breakpoints at 375 / 768 / 1024 / 1440 |
| Employer dashboards on mobile | Desktop-priority — fully responsive but Kanban/analytics show "best on desktop" hint |
| Charts (Recharts) | Hybrid — primary series brand blue/green, fallback to amber/slate/teal for 4+ series |
| White-labeling | Foundation only (CSS variables ready) — no UI yet |
| PWA | Aspirational — keep manifest, no special engineering |
| Visual regression | Skip — manual smoke testing only |
| Staging | Local review only |
| Accessibility | WCAG 2.1 AA |
| Auth role toggle | Single `/sign-up` page with slider, dynamically shows fields, routes to correct onboarding |
| Logo | Text/typography only — auto-themes via `text-foreground` |
| Scrollbars | Single auto-theming utility (replaces existing `scrollbar-dark`) |
| Filenames | kebab-case enforced (per memory rule) |
| Git strategy | Long-lived parent `feat/new-ui-ux` with sub-PRs per phase |

---

## 2. The CSS Variable Architecture

```
LAYER 1 — Primitive tokens (raw color values, light + dark variants)
  └── globals.css :root { --slate-900: 222 47% 11%; }
  └── globals.css .dark { /* dark overrides if needed */ }

LAYER 2 — Semantic tokens (meaning-bound, swap on theme)
  └── globals.css :root { --background: var(--slate-50);  --primary: var(--brand-700); }
  └── globals.css .dark { --background: var(--slate-900); --primary: var(--brand-400); }

LAYER 3 — Tailwind utilities (consumer-facing)
  └── tailwind.config.ts: primary: "hsl(var(--primary))"
  └── component: className="bg-primary text-primary-foreground"
```

**Result:** components only reference Layer 3 utilities. They have zero knowledge of light vs dark. The `.dark` class on `<html>` (managed by `next-themes`) flips Layer 2, which propagates everywhere automatically.

### Token inventory

**Primitives (Layer 1):**
- `--brand-50` through `--brand-950` (sky scale)
- `--accent-50` through `--accent-900` (green scale)
- `--surface-50` through `--surface-950` (slate scale)
- `--warning-{500,600,700}` (amber)
- `--error-{500,600,700}` (red)

**Semantics (Layer 2) — both light and dark variants:**
- `--background`, `--foreground`
- `--card`, `--card-foreground`
- `--popover`, `--popover-foreground`
- `--primary`, `--primary-foreground`
- `--secondary`, `--secondary-foreground`
- `--muted`, `--muted-foreground`
- `--accent`, `--accent-foreground` (used by shadcn for hover bg — not our brand accent)
- `--destructive`, `--destructive-foreground`
- `--warning`, `--warning-foreground`
- `--success`, `--success-foreground`
- `--border`, `--input`, `--ring`
- `--shadow-color` (for blue-tinted shadows)

**Sizes/radii (Layer 2):**
- `--radius` = `0.375rem` (6px)
- Buttons, inputs derive: `calc(var(--radius) - 2px)` = 4px

---

## 3. Branch & PR Strategy

```
main
└── feat/new-ui-ux  (long-lived parent)
    ├── phase-1/token-foundation     → PR → parent
    ├── phase-2/hardcoded-hex        → PR → parent
    ├── phase-3/shadcn-primitives    → PR → parent
    ├── phase-4a/auth                → PR → parent
    ├── phase-4b/seeker              → PR → parent
    ├── phase-4c1/employer-jobs      → PR → parent
    ├── phase-4c2/employer-create    → PR → parent
    ├── phase-4c3/employer-pipeline  → PR → parent
    ├── phase-4c4/employer-misc      → PR → parent
    ├── phase-4d/admin               → PR → parent
    ├── phase-4e/assessment          → PR → parent
    ├── phase-4f/marketing           → PR → parent
    └── phase-5/shell                → PR → parent
    (final QA → merge feat/new-ui-ux → main)

separate parents (after design merges):
└── feat/api-wiring        (Phase 6)
└── feat/security-hardening (Phase 7)
└── feat/testing            (Phase 8)
```

**PR rules:**
- Every PR ≤ 600 lines diff where possible
- Every PR runs `pnpm tsc --noEmit && pnpm lint` clean
- Every PR includes before/after screenshots in description
- No file moves/renames during design phases (preserves imports)

---

## 4. Phase Breakdown

### PHASE 0 — Pre-flight (15 min)
- Verify clean working tree on `main`, pull latest
- Create `feat/new-ui-ux` branch
- Run `pnpm dev`, confirm app boots
- Take baseline screenshots of: `/`, `/sign-in`, `/dashboard`, `/employer`, `/employer/jobs/create`
- Read `apps/web/src/components/shared/providers.tsx` to confirm where `ThemeProvider` will plug in

### PHASE 1 — Token Foundation (1–2 hrs) 🔥 Highest impact

**Goal:** every component auto-transforms from purple/Inter/light-only → blue/Jakarta/dark-aware in one commit.

**Files to modify (4):**

1. `apps/web/package.json` — add `next-themes` dependency via `pnpm add next-themes`

2. `apps/web/tailwind.config.ts`
   - Replace `brand.*` purple → sky scale, all values reference `hsl(var(--brand-N))`
   - Replace `accent.*` neon teal → green scale, all values reference `hsl(var(--accent-N))`
   - Replace `surface.*` warm stone → slate scale, all values reference `hsl(var(--surface-N))`
   - Update `fontFamily.sans` to `var(--font-jakarta)`
   - Add `fontFamily.mono` for code snippets
   - Add semantic color mappings (background, foreground, card, primary, etc.) all referencing `hsl(var(--*))`
   - Add `warning`, `success` to semantic colors
   - Update `boxShadow` (`card`, `card-hover`, `elevated`, `floating`) using `hsl(var(--shadow-color) / opacity)` for blue-tinted shadows
   - Add fade-in/fade-in-up keyframes + animations (used in toasts, modals)
   - Add explicit container breakpoints (640/768/1024/1280/1400)

3. `apps/web/src/styles/globals.css`
   - Replace `--font-sans` value with Plus Jakarta Sans stack
   - Replace `--radius: 0.75rem` with `0.375rem` (6px)
   - Add full primitive token set under `:root` (Layer 1)
   - Add full semantic token set under `:root` (Layer 2 — light)
   - Add full semantic token overrides under `.dark` (Layer 2 — dark)
   - Replace `.scrollbar-dark` block with single auto-theming `.scrollbar-themed` utility using `hsl(var(--surface-300))` in light, `hsl(var(--surface-700))` in dark
   - Update `.card-shadow` and `.card-shadow-hover` to use `hsl(var(--shadow-color))` with blue tint
   - Update body base styles to use `bg-background text-foreground`
   - Keep `.focus-brand`, `.text-gradient-brand`, `.page-container`, etc. — they auto-update through token rebind

4. `apps/web/src/app/layout.tsx`
   - Replace `import { Inter }` → `import { Plus_Jakarta_Sans }`
   - Set `weight: ["300","400","500","600","700","800"]`, `variable: "--font-jakarta"`, `display: "swap"`
   - Replace `themeColor: "#6c5ce7"` with theme-aware metadata (light: `#FFFFFF`, dark: `#0F172A`)
   - Replace body className `bg-surface-50 text-surface-800` → `bg-background text-foreground`
   - Add `suppressHydrationWarning` on `<html>` (already present — confirm)
   - The actual `ThemeProvider` wrapping happens in `providers.tsx`

5. `apps/web/src/components/shared/providers.tsx`
   - Add `next-themes` `ThemeProvider` wrapping existing providers
   - Config: `attribute="class"`, `defaultTheme="system"`, `enableSystem`, `disableTransitionOnChange`

**Smoke test before commit:**
- `pnpm dev` boots without errors
- Navigate to: `/`, `/sign-in`, `/dashboard`, `/employer`, `/employer/jobs/create`
- Confirm no purple visible by default
- Open DevTools, toggle `<html class="dark">` manually — confirm dark mode renders correctly
- Confirm Plus Jakarta Sans loaded (no FOIT/FOUT, browser inspector confirms font-family)
- `pnpm tsc --noEmit` passes
- `pnpm lint` passes

**Commit message:**
```
chore(design): migrate to CSS-variable token system + Plus Jakarta Sans + dark mode foundation

- Replaced purple brand palette with sky/green per FitVector design system
- Migrated Tailwind tokens to hsl(var(--*)) for runtime theming
- Added full dark-mode token set with brand color contrast shift (sky-400)
- Added next-themes ThemeProvider with system + manual toggle
- Plus Jakarta Sans replaces Inter as primary font
```

**PR title:** `phase 1: token foundation (CSS vars + dark mode + Plus Jakarta Sans)`

---

### PHASE 2 — Hardcoded Hex Cleanup (1–2 hrs)

7 files bypass the token system. Fix each.

**Files:**
1. `apps/web/src/app/(employer)/employer/analytics/page.tsx`
2. `apps/web/src/app/(employer)/employer/assessments/[id]/results/page.tsx`
3. `apps/web/src/app/(employer)/employer/page.tsx`
4. `apps/web/src/app/(employer)/employer/interviews/[id]/page.tsx`
5. `apps/web/src/app/(employer)/employer/interviews/compare/page.tsx`
6. `apps/web/src/components/jobs/fitvector-apply-modal.tsx`
7. `apps/web/src/app/(dashboard)/dashboard/community/salaries/page.tsx` (Recharts inline colors)

**Approach:**
- Each hardcoded hex → matching token class (`bg-brand-700`, `text-accent-600`, etc.)
- For Recharts inline color props: read from CSS variables via `getComputedStyle` helper, OR use a centralized chart palette in `apps/web/src/lib/chart-colors.ts` (kebab-case)
- No layout/structure changes

**New file to create:**
- `apps/web/src/lib/chart-colors.ts` — exported palette object referenced by all Recharts components

**PR title:** `phase 2: replace hardcoded hex with brand tokens + centralized chart palette`

---

### PHASE 3 — shadcn/ui Primitives Polish (3–4 hrs)

Make base components rock-solid against `DESIGN.md` before touching pages.

**Existing primitives in `apps/web/src/components/ui/`:**

| File | Changes |
|------|---------|
| `button.tsx` | Variants: `default` (blue primary), `cta` (NEW — green for conversion CTAs), `destructive`, `outline`, `ghost`, `link`, `icon`. Sizes per DESIGN.md |
| `card.tsx` | Padding 24px, radius 6px, shadow `card`, dark-mode aware |
| `badge.tsx` | Add status variants: `success`, `warning`, `error`, `neutral`, `info` |
| `input.tsx` | Border `border`, focus ring `ring`, error state, disabled state |
| `label.tsx` | 14px / weight-500 / `text-foreground` |
| `select.tsx` | Match input styling |
| `textarea.tsx` | Match input styling |
| `tabs.tsx` | Active tab: `border-b-2 border-primary text-primary` |
| `progress.tsx` | Track `bg-secondary`, fill `bg-primary` |
| `separator.tsx` | `bg-border` |
| `sheet.tsx` | Shadow `floating`, radius 12px on open edge |
| `avatar.tsx` | Default fallback `bg-secondary text-secondary-foreground` |
| `confirm-modal.tsx` | Modal shadow `floating`, destructive variant uses `--destructive` |

**New primitives to create (kebab-case files, PascalCase exports):**

| File | Purpose |
|------|---------|
| `apps/web/src/components/ui/status-badge.tsx` | All 5 status variants + props for icon |
| `apps/web/src/components/ui/match-score-pill.tsx` | AI match score with auto-color (high/mid/low thresholds) |
| `apps/web/src/components/ui/bulk-action-bar.tsx` | Sticky bottom bar for table multi-select |
| `apps/web/src/components/ui/page-header.tsx` | `<h1>` + subtitle + actions slot pattern |
| `apps/web/src/components/ui/empty-state.tsx` | Icon + message + CTA pattern (replaces ad-hoc empty states) |
| `apps/web/src/components/ui/theme-toggle.tsx` | Light/dark toggle, lives in user menu/settings |

**Note:** there's already `apps/web/src/components/shared/empty-state.tsx`. Phase 3 either consolidates these or marks the shared one as deprecated. Decision: keep `shared/empty-state.tsx` as-is, build new `ui/empty-state.tsx` as the canonical primitive, migrate consumers in Phase 4.

**PR title:** `phase 3: shadcn primitives aligned to DESIGN.md + new status/score/empty-state/theme-toggle primitives`

---

### PHASE 4 — Page Polish (per route group)

#### 4a — Auth `(auth)/`
- `/sign-in` — slider toggle (Job Seeker | Employer), unified form
- `/sign-up` — same toggle, dynamically adjusts copy and required fields, routes to correct onboarding
- `/forgot-password`, `/reset-password`
- Hero/visual side panel
- OAuth buttons (Google, LinkedIn — official brand colors per DESIGN.md exception)
- Form validation states using new tokens
- Mobile-first: form stacks on mobile, side-by-side from `md:` up
- Dark mode visually verified

**PR title:** `phase 4a: auth flows polish + role-toggle slider`

#### 4b — Job Seeker Dashboard `(dashboard)/`
- Dashboard home (stats, recent jobs, recommended)
- Jobs list + filters + search
- Job detail page
- Resume builder
- Applications tracker
- Community
- Settings (includes `<ThemeToggle/>`)

**PR title:** `phase 4b: seeker dashboard polish`

#### 4c — Employer (split into 4 PRs)

**4c.1** Dashboard + jobs management
- `/employer` home, `/employer/jobs` list, `/employer/jobs/[id]`
- Use `bg-canvas-app` (slate-50) instead of `bg-canvas-marketing` for app shell

**PR title:** `phase 4c1: employer dashboard + job management polish`

**4c.2** Create-job wizard
- `/employer/jobs/create/page.tsx` (orchestrator)
- All 8 step components in `_components/`
- step-6-assessment.tsx is 539 lines — internal sub-decomposition allowed if components > 80 lines stick out

**PR title:** `phase 4c2: create-job wizard polish (8 steps)`

**4c.3** Candidates + pipeline
- `/employer/candidates` list (data table — use new `<BulkActionBar/>`)
- `/employer/candidates/[id]` detail (627-line file — internal decomposition where helpful)
- `/employer/pipeline` Kanban — full DESIGN.md Kanban patterns, horizontal scroll on mobile with desktop hint

**PR title:** `phase 4c3: candidates + pipeline polish`

**4c.4** Analytics, interviews, assessments, branding, settings
- `/employer/analytics` — Recharts using `chart-colors.ts`
- `/employer/interviews`
- `/employer/assessments`
- `/employer/branding`
- `/employer/settings` (includes `<ThemeToggle/>`)

**PR title:** `phase 4c4: employer analytics/interviews/assessments/settings polish`

#### 4d — Admin `(admin)/`
**PR title:** `phase 4d: admin panels polish`

#### 4e — Assessment-taking `(assessment)/`
- Focus mode — minimal UI, distraction-free
- Code editor styling (if applicable)
**PR title:** `phase 4e: assessment-taking flow polish`

#### 4f — Marketing & onboarding ✅ (homepage done 2026-04-27)

**Homepage (`/page.tsx`) — COMPLETE**

Fully rewritten as a dual-sided B2B + B2C landing page. 9 sections:

| # | Section | Key design detail |
|---|---------|------------------|
| 1 | Navbar | Dual CTA: "Post a Job" (green outline) + "Get Started Free" (primary) + audience links |
| 2 | Hero | Neutral headline + two split audience cards (blue/green accent bars) + social proof inline |
| 3 | For Job Seekers | `bg-surface-50` section, 4 feature cards, blue badge label |
| 4 | For Employers | `bg-card` section, 4 feature cards (FitScore/Assessments/Interviews/Pipeline), green badge label |
| 5 | How It Works | Side-by-side columns (seekers left, employers right), numbered step connectors |
| 6 | Trust Stats | Dark `bg-brand-900` bar — 10,000+ seekers / 500+ companies / 95% accuracy / 3× faster |
| 7 | Testimonials | 2 cards: Engineering Manager (FitScore praise) + Software Engineer (resume tailoring praise); audience labels |
| 8 | Pricing | Seeker plans (Free/Starter/Pro/Elite) + Employer plans (Starter/Growth/Enterprise) — section dividers |
| 9 | Final CTA | Split blue (seeker) / green (employer) cards with individual conversion copy |

**Remaining 4f tasks:**
- `/onboarding/*` polish
- `/signup` page role-toggle slider (see Phase 4a)

**PR title:** `phase 4f: dual-sided homepage + onboarding polish`

---

### PHASE 5 — Shell & Cross-Cutting (2–3 hrs)

**Files in `apps/web/src/components/layout/`:**
- Top nav (employer + seeker variants)
- Sidebar (employer) — sleek auto-theming scrollbar
- Mobile bottom nav (seeker)
- Footer

**Cross-cutting:**
- All `EmptyState` consumers → `ui/empty-state.tsx`
- Loading skeletons — see table below
- Sonner toast theming (configure to follow `useTheme()`)
- Visual error boundary fallback (actual logic = Phase 7)

#### Loading Skeletons ✅ (partial — 2026-04-27)

Loading skeletons use `animate-pulse` + `bg-surface-100/200` tokens (auto light/dark, no `dark:` overrides needed).

**Completed:**

| File | Route | Layout matched |
|------|-------|---------------|
| `(employer)/employer/loading.tsx` | `/employer` | 4-stat row + funnel chart + activity feed + quick actions + plan card |
| `(dashboard)/dashboard/loading.tsx` | `/dashboard` | Welcome header + 4 quick-action cards + 4 stat cards |

**Pattern rules for all future skeletons:**
- `animate-pulse` on the root wrapper — single class, not per-element
- Skeleton shapes must match actual rendered layout (same grid columns, same card heights)
- Use `bg-surface-200` for primary skeleton elements (titles, large values)
- Use `bg-surface-100` for secondary elements (subtitles, body text, icons)
- Use `rounded-md` for text-like skeletons, `rounded-lg` for card blocks, `rounded-full` for avatars/badges
- Never use hardcoded pixel widths — use Tailwind fractions (`w-2/3`, `w-36`) or `w-full`
- Skeleton files have zero imports (no client boundary) — pure HTML divs only

**Remaining skeletons to add (during page polish phases):**

| Phase | File | Route |
|-------|------|-------|
| 4a | `(auth)/login/loading.tsx` | `/login` |
| 4b | `(dashboard)/dashboard/jobs/loading.tsx` | `/dashboard/jobs` |
| 4b | `(dashboard)/dashboard/tracker/loading.tsx` | `/dashboard/tracker` |
| 4b | `(dashboard)/dashboard/resume/loading.tsx` | `/dashboard/resume` |
| 4c1 | `(employer)/employer/jobs/loading.tsx` | `/employer/jobs` |
| 4c3 | `(employer)/employer/candidates/loading.tsx` | `/employer/candidates` |
| 4c3 | `(employer)/employer/pipeline/loading.tsx` | `/employer/pipeline` |
| 4c4 | `(employer)/employer/analytics/loading.tsx` | `/employer/analytics` |
| 4c4 | `(employer)/employer/interviews/loading.tsx` | `/employer/interviews` |
| 4c4 | `(employer)/employer/assessments/loading.tsx` | `/employer/assessments` |

**PR title:** `phase 5: shell + cross-cutting layout primitives + remaining loading skeletons`

---

### ⏸ DESIGN MERGE GATE

Before merging `feat/new-ui-ux` → `main`:
- Visual QA on all 5 baseline pages, light + dark
- Compare baseline screenshots
- `pnpm build` passes
- `pnpm tsc --noEmit` passes
- `pnpm lint` passes
- Manual mobile test on Chrome DevTools (375 / 768 / 1024 / 1440)
- Theme toggle works without flash on first paint

---

### PHASE 6 — Mock Data → Live API (separate epic)

13 pages currently use `lib/mock/*`. Replace with TanStack Query hooks against Supabase. One PR per mock file.

**Mock files to phase out:**
1. `analytics-data.ts` → `useAnalytics` hook
2. `assessment-data.ts` → `useAssessmentResults` hook
3. `branding-data.ts` → `useBranding` hook
4. `community-data.ts` → `useCommunity` hook
5. `employer-data.ts` → `useEmployerProfile` hook
6. `interview-data.ts` → `useInterviews` hook
7. `scheduling-data.ts` → `useScheduling` hook
8. `seeker-marketplace-data.ts` → `useMarketplace` hook

**Branch:** `feat/api-wiring` parent, sub-branches per data domain.

---

### PHASE 7 — Security Hardening (separate epic)

- Python AI service: replace CORS wildcard with env-driven origin allowlist
- Python AI service: remove `ssl._create_unverified_context`, fix root cause
- Add rate limiting to `/api/ai/*` (Upstash Ratelimit or in-memory)
- Add Next.js error boundaries (route-level + global)

**Branch:** `feat/security-hardening`

---

### PHASE 8 — Testing (separate epic)

- Vitest unit tests (utility functions, hooks)
- Playwright E2E (sign-up, create job, apply, take assessment)

**Branch:** `feat/testing`

---

## 5. Naming Conventions (Zero Mistakes)

### Filenames — all kebab-case
- ✅ `status-badge.tsx`, `match-score-pill.tsx`, `theme-toggle.tsx`, `chart-colors.ts`
- ❌ Never `StatusBadge.tsx`, `themeToggle.tsx`

### Component exports — PascalCase inside kebab-case file
```tsx
// status-badge.tsx
export function StatusBadge() { ... }
```

### Token names
- **Tailwind keys:** flat lowercase, numeric variants — `brand.50`, `accent.500`, `surface.900`
- **CSS variables:** kebab-case — `--brand-700`, `--card-foreground`, `--font-jakarta`
- **Semantic tokens:** kebab-case, no scale numbers — `--background`, `--primary`, `--ring`

### Hooks — camelCase, prefixed `use`
- ✅ `useEmployerJobs`, `useAssessments`, `useTheme`

### Constants — UPPER_SNAKE_CASE
- ✅ `STEPS`, `INITIAL_FORM`, `DEFAULT_PIPELINE_STAGES`

---

## 6. Connection Safety Rules (Zero Broken Imports)

1. **No file moves or renames during design phases.** Imports stay where they are.
2. **No deletions of components during design.** Flag stale code at end, clean up in a final dedicated PR.
3. New primitives in Phase 3 ship in their own PR — no other file edits in same commit. Phase 4 page edits import them.
4. After every phase: `pnpm tsc --noEmit && pnpm lint` must pass before commit.
5. `_components/` folders inside route groups follow Next.js convention (leading underscore = private). Don't rename.
6. The existing `shared/empty-state.tsx` and `shared/loading-spinner.tsx` stay until consumers migrate to `ui/empty-state.tsx` in Phase 4.

---

## 7. Risk Register

| Risk | Mitigation |
|------|-----------|
| Theme flash on first paint | `next-themes` with `disableTransitionOnChange` + `suppressHydrationWarning` on `<html>` |
| Recharts colors don't update with theme | Centralize in `chart-colors.ts`, use `getComputedStyle()` reader for runtime CSS-var values |
| shadcn primitive override breaks an existing page | Phase 3 isolates primitive changes; pages get touched in Phase 4 only |
| Dark mode contrast fail | WCAG 2.1 AA verified during smoke test of every phase |
| Mobile layout breaks at 375px | Mobile-first approach: write base styles for 375, layer up with `sm:`, `md:`, `lg:` |
| Brand color shift in dark mode looks "different" | Document the shift in DESIGN.md, accept it — accessibility > strict brand consistency |

---

## 8. Time Estimates

| Phase | Estimate |
|-------|---------|
| Phase 0 | 15 min |
| Phase 1 | 1–2 hrs |
| Phase 2 | 1–2 hrs |
| Phase 3 | 3–4 hrs |
| Phase 4 (4a–4f, 9 sub-PRs) | 12–16 hrs |
| Phase 5 | 2–3 hrs |
| **Design subtotal** | **~20–28 hrs** |
| Phase 6 (API wiring) | 8–12 hrs |
| Phase 7 (security) | 4–6 hrs |
| Phase 8 (testing) | 8+ hrs |

Realistic split: 4–6 working sessions for the design overhaul.

---

## 9. Decision Log (Q&A Appendix)

| # | Question | Decision |
|---|----------|---------|
| Q1 | Dark mode trigger | System + manual toggle, localStorage + cookie |
| Q2 | Dark mode aesthetic | Slate-warm-dark `#0F172A` / `#1E293B` |
| Q3 | Dark mode scope | Every page |
| Q4 | White-labeling | Foundation via CSS vars, no UI yet |
| Q5 | Chart colors | Hybrid — brand primary, semantic fallback |
| Q6 | Mobile breakpoints | 375 / 768 / 1024 / 1440 |
| Q7 | Employer dashboards on mobile | Desktop-priority with hint |
| Q8 | PWA | Aspirational only |
| Q9 | Visual regression | Skip |
| Q10 | Staging | Local only |
| Q11 | Accessibility | WCAG 2.1 AA |
| Q12 | Token naming | Hybrid (semantic + brand scales) |
| Q13 | Dark brand contrast | Shift to sky-400 in dark mode |
| Q14 | Auth role toggle | Single page, dynamic fields, route on submit |
| Q15 | Logo | Text only, auto-themes |
| Q16 | Scrollbar utility | Single auto-theming `.scrollbar-themed` |

---

## 10. Approval Checkpoint

This plan is locked. To begin execution:

1. User approves this document
2. Engineering executes Phase 0 (branch creation + baseline screenshots)
3. Engineering executes Phase 1 (4 file changes + new dependency)
4. Engineering opens PR for review
5. Iterate phase by phase

**Awaiting:** User approval to start Phase 0 + Phase 1.
