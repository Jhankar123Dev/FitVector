# FitVector Pro — Custom Design System

> Hybrid system: Stripe's light-mode structure + Linear's data density patterns.
> Audience: Dual-sided marketplace — Job Seekers (B2C conversion) + Employers (B2B trust).
> Stack: Next.js 14+ App Router, TypeScript, Tailwind CSS, shadcn/ui.
> This file is the single source of truth. It overrides all other design references.

---

## 1. Color Psychology & Palette

### Why This Palette

FitVector serves two psychologically distinct users simultaneously:

- **Employers (B2B):** Analytical, risk-averse, judging platform credibility within seconds. Need to feel: *authority, control, reliability.* Color trigger: deep navy + professional blue.
- **Job Seekers (B2C):** Hopeful, anxious, seeking empowerment. Need to feel: *momentum, possibility, safe to act.* Color trigger: active blue + growth green.

The palette resolves this tension with a two-tier blue system (authority + action) and a rationed green reserved exclusively for conversion moments.

---

### Primary Palette

| Token | Hex | Role | Psychology |
|-------|-----|------|------------|
| `brand-navy` | `#0C4A6E` | Headings, logo, authority elements | Deep expertise, B2B trust anchor |
| `brand-blue` | `#0369A1` | Buttons, links, interactive elements | Action, engagement, approachability |
| `brand-blue-light` | `#0EA5E9` | Hover highlights, secondary accents | Lightness, approachability |
| `cta-green` | `#22C55E` | Primary CTAs ONLY, match scores, success | Conversion trigger, "go", growth |
| `cta-green-hover` | `#15803D` | Hover state on green CTAs | Depth, confirms action |

**Rules:**
- `brand-navy` is for headings, the logo mark, sidebar labels, and employer dashboard headers — never for buttons
- `brand-blue` is for all interactive elements (buttons, links, active nav, focus rings)
- `cta-green` is rationed — ONLY for: primary CTA buttons ("Apply Now", "Post a Job"), AI match score indicators, positive status badges. Never use decoratively.
- Never mix green and blue on adjacent interactive elements

---

### Surface & Background System

| Token | Hex | Use |
|-------|-----|-----|
| `bg-canvas-marketing` | `#F0F9FF` | Marketing pages, landing, onboarding — subtle brand tint signals blue platform subconsciously |
| `bg-canvas-app` | `#F8FAFC` | App shell, employer dashboard, dense data views — neutral to prevent color noise |
| `bg-surface` | `#FFFFFF` | Cards, panels, modals, data tables — must pop against canvas |
| `bg-surface-subtle` | `#F1F5F9` | Nested panels, sidebar backgrounds, hover rows |
| `bg-surface-brand` | `#EFF6FF` | Highlighted cards, active states with blue tint |

---

### Text Scale

| Token | Hex | Use |
|-------|-----|-----|
| `text-primary` | `#0F172A` | Headings, card titles, primary labels — near-black with blue undertone |
| `text-body` | `#334155` | Body copy, descriptions, form content |
| `text-muted` | `#64748B` | Secondary labels, metadata, placeholders |
| `text-subtle` | `#94A3B8` | Timestamps, de-emphasized hints |
| `text-inverse` | `#FFFFFF` | Text on dark/colored backgrounds |
| `text-brand` | `#0369A1` | Links, active navigation, interactive text |
| `text-heading-authority` | `#0C4A6E` | Page titles, section headers, employer dashboard headers |

---

### Border System

| Token | Hex | Use |
|-------|-----|-----|
| `border-default` | `#E2E8F0` | Standard card borders, dividers, input fields |
| `border-subtle` | `#F1F5F9` | Nested container separators, very soft divisions |
| `border-strong` | `#CBD5E1` | Emphasized borders, active form inputs (unfocused) |
| `border-focus` | `#0369A1` | Focus rings on all interactive elements (2px solid) |
| `border-success` | `#22C55E` | Positive status borders |
| `border-error` | `#DC2626` | Error state borders |

---

### Semantic / Status Colors

| Token | Hex | Use |
|-------|-----|-----|
| `status-success` | `#22C55E` | Hired, applied, matched |
| `status-success-bg` | `#F0FDF4` | Success badge backgrounds |
| `status-success-text` | `#15803D` | Success badge text |
| `status-warning` | `#D97706` | "Closes soon", pending review, expiring |
| `status-warning-bg` | `#FFFBEB` | Warning badge backgrounds |
| `status-warning-text` | `#92400E` | Warning badge text |
| `status-error` | `#DC2626` | Rejected, failed, validation errors |
| `status-error-bg` | `#FEF2F2` | Error badge backgrounds |
| `status-error-text` | `#991B1B` | Error badge text |
| `status-neutral` | `#64748B` | Pending, draft, inactive |
| `status-neutral-bg` | `#F8FAFC` | Neutral badge backgrounds |
| `status-neutral-text` | `#334155` | Neutral badge text |

---

### Banned Colors

- **All purple and indigo** — `#533afd`, `#5e6ad2`, `#7170ff`, `#6366f1` and any variant. FitVector is blue/green. Purple was Stripe's and Linear's brand, not ours.
- **Warm orange as primary** — orange CTAs signal e-commerce, not professional SaaS.
- **Pure black `#000000`** for headings — always use `#0F172A` or `#0C4A6E`.
- **Gray-only text** — text should have a cool blue undertone (slate scale), never warm gray.

---

## 2. Typography

### Font

**Plus Jakarta Sans** — exclusively. Load from Google Fonts.

```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,opsz,wght@0,6..18,300;0,6..18,400;0,6..18,500;0,6..18,600;0,6..18,700;0,6..18,800;1,6..18,400&display=swap');
```

```css
body {
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-feature-settings: 'kern' 1;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

**Banned fonts:** `sohne-var`, `Inter` alone without explicit purpose, `system-ui` as default. Never fall back to generic system fonts — always include the full Plus Jakarta Sans fallback chain.

**Monospace (code, IDs, technical labels):** `'JetBrains Mono', 'Fira Code', 'Cascadia Code', ui-monospace, monospace`

---

### Type Scale

| Role | Size | Weight | Line Height | Letter Spacing | Use |
|------|------|--------|-------------|----------------|-----|
| Display | 48px / 3rem | 700 | 1.05 | -0.96px | Hero headlines only |
| Heading 1 | 36px / 2.25rem | 700 | 1.10 | -0.72px | Page titles |
| Heading 2 | 28px / 1.75rem | 700 | 1.15 | -0.56px | Section titles |
| Heading 3 | 22px / 1.375rem | 600 | 1.25 | -0.22px | Card headers, subsections |
| Heading 4 | 18px / 1.125rem | 600 | 1.30 | -0.18px | Dashboard panel titles |
| Body Large | 18px / 1.125rem | 400 | 1.60 | normal | Feature descriptions |
| Body | 16px / 1rem | 400 | 1.60 | normal | Standard reading text |
| Body Medium | 16px / 1rem | 500 | 1.60 | normal | Navigation, form labels |
| Body Small | 14px / 0.875rem | 400 | 1.50 | normal | Secondary content, captions |
| Label | 13px / 0.8125rem | 500 | 1.40 | 0.01em | Table column headers, metadata |
| Caption | 12px / 0.75rem | 400 | 1.40 | normal | Timestamps, fine print |
| Caption Strong | 12px / 0.75rem | 600 | 1.40 | 0.02em | Badge text, status labels (uppercase optional) |
| Micro | 11px / 0.6875rem | 500 | 1.35 | 0.04em | Overlines, tiny annotations |

**Principles:**
- Negative letter-spacing at display/heading sizes — headlines should feel engineered, not typeset
- Weight 400 for reading, 500 for navigation/labels, 600 for emphasis, 700 for headlines
- Never use weight 300 (too fragile for a data-heavy app) or weight 800+ (too aggressive)
- Line length: 60–75 characters per line for body text. Use `max-w-prose` on reading content.

---

## 3. Spacing System

Base unit: **8px**

| Token | Value | Tailwind |
|-------|-------|---------|
| `space-1` | 4px | `p-1` |
| `space-2` | 8px | `p-2` |
| `space-3` | 12px | `p-3` |
| `space-4` | 16px | `p-4` |
| `space-5` | 20px | `p-5` |
| `space-6` | 24px | `p-6` |
| `space-8` | 32px | `p-8` |
| `space-10` | 40px | `p-10` |
| `space-12` | 48px | `p-12` |
| `space-16` | 64px | `p-16` |
| `space-20` | 80px | `p-20` |

Section padding (desktop): `80px–96px` vertical. Section padding (mobile): `48px` vertical.
Max content width: `1280px` (`max-w-7xl`). Readable content: `768px` (`max-w-3xl`). Data tables: full width within container.

---

## 4. Border Radius (Stripe-Derived — Conservative)

| Token | Value | Use |
|-------|-------|-----|
| `radius-xs` | 2px | Inline tags, overline badges |
| `radius-sm` | 4px | Buttons, inputs, small badges — the workhorse |
| `radius-md` | 6px | Cards, dropdowns, navigation containers |
| `radius-lg` | 8px | Featured cards, modals, popovers |
| `radius-xl` | 12px | Large panels, command palettes, hero cards |
| `radius-pill` | 9999px | Status pills, filter chips ONLY |
| `radius-circle` | 50% | Avatars, icon buttons |

**Rule:** Default to 4px–6px. Never exceed 12px on structural components. Pill shapes are reserved for status indicators and filter chips only — not buttons.

---

## 5. Shadow System (Stripe-Derived — Blue-Tinted)

Shadows use a cool blue-gray tint that echoes the brand palette. This makes elevation feel on-brand, not generic.

| Level | CSS | Use |
|-------|-----|-----|
| Flat | `none` | Page background, inline elements |
| Subtle | `0px 1px 3px rgba(2, 55, 112, 0.06), 0px 1px 2px rgba(0,0,0,0.04)` | Table rows on hover, list items |
| Card | `0px 4px 6px -1px rgba(2, 55, 112, 0.08), 0px 2px 4px -1px rgba(0,0,0,0.04)` | Standard cards, panels |
| Elevated | `0px 10px 25px -5px rgba(2, 55, 112, 0.12), 0px 4px 10px -5px rgba(0,0,0,0.06)` | Dropdowns, popovers, sticky headers |
| Floating | `0px 20px 40px -10px rgba(2, 55, 112, 0.18), 0px 8px 20px -8px rgba(0,0,0,0.08)` | Modals, command palette, floating panels |
| Focus Ring | `0 0 0 2px #FFFFFF, 0 0 0 4px #0369A1` | Keyboard focus on all interactive elements |

**Rule:** Never use warm-gray shadows (`rgba(0,0,0,...)` alone). Always include the blue-tinted layer. The `rgba(2, 55, 112, ...)` base is derived from brand-navy.

---

## 6. Component Patterns

### Buttons

**Primary CTA (Green — Conversion Trigger)**
```
bg: #22C55E | text: #FFFFFF | hover-bg: #15803D
padding: 10px 20px | radius: 4px | font: 15px weight-600
shadow: Card level | transition: 150ms ease
Use: "Apply Now", "Post a Job", "Start Free Trial"
```

**Primary Action (Blue — Interactive)**
```
bg: #0369A1 | text: #FFFFFF | hover-bg: #0C4A6E
padding: 10px 20px | radius: 4px | font: 15px weight-600
shadow: Card level | transition: 150ms ease
Use: "Save", "Next Step", "Submit", "Search Jobs"
```

**Secondary / Ghost**
```
bg: transparent | text: #0369A1 | border: 1px solid #E2E8F0
hover: bg #F0F9FF, border #0369A1
padding: 10px 20px | radius: 4px | font: 15px weight-500
Use: Secondary actions, "Cancel", "View Details"
```

**Destructive**
```
bg: transparent | text: #DC2626 | border: 1px solid #FECACA
hover: bg #FEF2F2, border #DC2626
padding: 10px 20px | radius: 4px
Use: "Delete", "Remove", "Revoke Access"
```

**Icon Button**
```
bg: transparent | hover: bg #F1F5F9 | radius: 6px
padding: 8px | icon: 18px | transition: 150ms
Always add cursor-pointer and aria-label
```

---

### Cards

**Standard Card**
```
bg: #FFFFFF | border: 1px solid #E2E8F0 | radius: 6px
shadow: Card level | padding: 24px
hover: shadow Elevated, transition 200ms
```

**Data Panel Card (Dashboard)**
```
bg: #FFFFFF | border: 1px solid #E2E8F0 | radius: 6px
shadow: Card level | padding: 0 (internal sections handle padding)
header: 16px 24px padding, border-bottom 1px solid #E2E8F0
body: 24px padding | no hover effect (static data container)
```

**Featured / Hero Card**
```
bg: #FFFFFF | border: 1px solid #0EA5E9 | radius: 8px
shadow: Elevated | padding: 32px
Use: Featured job listings, premium employer cards
```

**Employer Pipeline Card (Kanban)**
```
bg: #FFFFFF | border: 1px solid #E2E8F0 | border-left: 3px solid (status color) | radius: 4px
shadow: Subtle | padding: 12px 16px
hover: shadow Card, translate-y -1px, transition 150ms
Dragging: shadow Floating, opacity 0.95, rotate-1
```

---

### Data Tables

```
header row: bg #F8FAFC | font: 12px weight-600, color #64748B, uppercase, letter-spacing 0.04em
data row: bg #FFFFFF | border-bottom: 1px solid #F1F5F9 | font: 14px weight-400, color #334155
hover row: bg #F8FAFC | transition 100ms
selected row: bg #EFF6FF | border-left: 3px solid #0369A1
action column: right-aligned, opacity 0 on row, opacity 1 on row hover
sticky first column: bg inherits, border-right: 1px solid #E2E8F0
```

**Bulk Action Bar (appears on multi-select):**
```
position: sticky bottom | bg: #0C4A6E | text: #FFFFFF
padding: 12px 24px | radius: 6px | shadow: Floating
contains: count label + action buttons
```

---

### Status Badges / Pills

```
Base structure: inline-flex | radius: 4px | padding: 2px 8px
font: 12px weight-600 | letter-spacing: 0.02em

Applied/Active:   bg #EFF6FF, text #0369A1, border 1px solid #BFDBFE
Hired/Success:    bg #F0FDF4, text #15803D, border 1px solid #BBF7D0
Pending/Review:   bg #FFFBEB, text #92400E, border 1px solid #FDE68A
Rejected/Closed:  bg #FEF2F2, text #991B1B, border 1px solid #FECACA
Draft/Inactive:   bg #F8FAFC, text #334155, border 1px solid #E2E8F0
```

**AI Match Score Pill (special case):**
```
High (80–100%):  bg #22C55E, text #FFFFFF, radius 9999px, font 12px weight-700
Mid (50–79%):    bg #0369A1, text #FFFFFF, radius 9999px
Low (<50%):      bg #94A3B8, text #FFFFFF, radius 9999px
```

---

### Inputs & Forms

```
input: bg #FFFFFF | border: 1px solid #E2E8F0 | radius: 4px
padding: 10px 14px | font: 15px weight-400, color #334155
placeholder: color #94A3B8
focus: border #0369A1, shadow Focus Ring, outline none
error: border #DC2626, bg #FEF2F2
disabled: bg #F8FAFC, color #94A3B8, cursor not-allowed
label: 14px weight-500, color #334155, margin-bottom 6px
helper text: 13px weight-400, color #64748B
error message: 13px weight-500, color #DC2626
```

**Search Input (job search hero):**
```
height: 52px | padding: 0 20px 0 48px (icon-aware)
font: 16px weight-400 | radius: 4px left, 0 right (if attached to button)
border: 1px solid #0369A1 (always active border on hero search)
shadow: Elevated
```

---

### Navigation

```
bg: #FFFFFF | border-bottom: 1px solid #E2E8F0
shadow: Subtle (only on scroll) | height: 64px | sticky top-0 z-50
logo: brand-navy #0C4A6E
links: 14px weight-500, color #334155, hover color #0369A1, transition 150ms
active link: color #0369A1, bg #EFF6FF, radius 4px
CTA right: Primary Action blue button ("Sign In") + Primary CTA green ("Get Started")
mobile: hamburger at 768px, slide-in drawer from right
```

**Sidebar (Employer Dashboard):**
```
bg: #F8FAFC | border-right: 1px solid #E2E8F0 | width: 240px
section label: 11px weight-600, color #94A3B8, uppercase, letter-spacing 0.08em
nav item: 14px weight-500, color #334155, padding 8px 12px, radius 4px
active nav item: bg #EFF6FF, color #0369A1, font weight-600
icon: 18px, color inherits from text
```

---

### Kanban / Pipeline Board (Employer Hiring View)

```
board: horizontal scroll | bg: #F8FAFC | padding: 24px | gap: 16px between columns

column:
  width: 280px | flex-shrink: 0
  header: 14px weight-600, color #334155 + count badge
  bg: #F1F5F9 | radius: 8px | padding: 12px

count badge:
  bg: #E2E8F0 | color: #64748B | radius: 9999px | 11px weight-600 | padding: 1px 7px

candidate card (see Employer Pipeline Card above):
  margin-bottom: 8px
  stage color on left border: matches status-* tokens

add card button:
  bg: transparent | border: 1px dashed #CBD5E1
  hover: border-color #0369A1, bg #EFF6FF | radius: 4px | padding: 10px
  icon: 16px + "Add Candidate" label | color #64748B hover #0369A1
```

---

## 7. Layout Principles

### Whitespace Philosophy (Stripe-Derived)
- **Dense data, generous chrome.** Financial/recruitment data displays are tight and information-rich. The UI chrome around them — padding, section spacing, card gutters — is generous. This makes dense data feel organized, not overwhelming.
- **Section rhythm.** Alternate light canvas sections with subtle brand-tinted sections (`#F0F9FF`) for landing pages. Never use dark sections except for a single hero-area CTA block (`#0C4A6E` background, white text).
- **Measured whitespace.** Every gap is intentional. Use the 8px grid. Avoid arbitrary pixel values.

### Responsive Breakpoints

| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile | < 640px | Single column, stacked cards, bottom nav |
| Tablet | 640px–1024px | 2-column grids, collapsible sidebar |
| Desktop | 1024px–1280px | Full layout, expanded sidebar, 3-column grids |
| Large | > 1280px | Centered max-w-7xl, generous margins |

### Z-Index Scale

| Layer | Value | Use |
|-------|-------|-----|
| Base | 0 | Default content |
| Raised | 10 | Cards on hover, tooltips anchors |
| Sticky | 20 | Sticky table headers, bulk action bar |
| Navbar | 30 | Top navigation |
| Drawer | 40 | Sidebar drawers, mobile nav |
| Modal | 50 | Dialogs, confirmations |
| Popover | 60 | Dropdowns, command palette |
| Toast | 70 | Notification toasts (always on top) |

---

## 8. Motion & Transitions

- **Micro-interactions:** 150ms ease — button hover, input focus, badge color changes
- **Component transitions:** 200ms ease — card hover lift, dropdown open
- **Page/panel transitions:** 250ms ease-in-out — drawer open, modal appear
- **Never exceed 300ms** for any UI feedback — it will feel sluggish on data-heavy pages
- **Always respect:** `@media (prefers-reduced-motion: reduce)` — disable transforms and opacity transitions, keep instant state changes

---

## 9. Accessibility Requirements (Non-Negotiable)

- Color contrast: minimum **4.5:1** for normal text, **3:1** for large text (18px+ or 14px+ bold)
- Focus ring: always visible — `0 0 0 2px #FFFFFF, 0 0 0 4px #0369A1` on all interactive elements
- Touch targets: minimum **44×44px** — never smaller on clickable elements
- Icons: always paired with `aria-label` when used without visible text
- Form inputs: always have an associated `<label>` — never placeholder-only
- Status colors: never rely on color alone — always pair with text or icon
- Loading states: skeleton screens on data loads > 200ms, spinner on actions > 500ms

---

## 10. Pre-Delivery Checklist

Run before every component delivery:

### Visual
- [ ] No emojis as UI icons — use Lucide icons exclusively
- [ ] All text uses Plus Jakarta Sans — no sohne-var, no Inter, no system-ui fallback
- [ ] No purple or indigo colors anywhere
- [ ] Green (#22C55E) only on CTAs and positive scores — not decorative
- [ ] Headings use #0C4A6E or #0F172A — never pure black #000000

### Interaction
- [ ] cursor-pointer on every clickable element
- [ ] Hover feedback on all interactive surfaces
- [ ] Transitions 150–250ms — never instant, never > 300ms
- [ ] Focus ring visible on keyboard navigation

### Data Components
- [ ] Kanban cards have left-border status color
- [ ] Table headers: uppercase, slate-500, 12px weight-600
- [ ] Bulk action bar appears on multi-select
- [ ] Mobile tables have overflow-x-auto wrapper

### Accessibility
- [ ] 4.5:1 contrast ratio verified on body text
- [ ] All images have alt text
- [ ] All icon-only buttons have aria-label
- [ ] All form inputs have associated label
- [ ] prefers-reduced-motion respected

### Responsive
- [ ] Tested at 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile
- [ ] Touch targets minimum 44×44px on mobile
- [ ] Sidebar collapses on tablet and below
