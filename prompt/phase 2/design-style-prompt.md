# FitVector Design System — Modern SaaS Style

> Paste this in your coding chat. Attach `project-structure.md`.

---

Set up a custom design system for FitVector with a modern SaaS look inspired by Stripe and Intercom. Update the existing Tailwind config and global CSS.

**1. Color palette — update `tailwind.config.ts`:**

```typescript
// Primary brand color: Deep indigo-violet (professional but modern)
// Accent: Bright teal-green (action/success states)
// Neutral: Warm slate grays (not cold blue-gray)

colors: {
  brand: {
    50: '#f0f0ff',
    100: '#e0e0ff', 
    200: '#c7c4ff',
    300: '#a5a0ff',
    400: '#8278ff',
    500: '#6c5ce7',   // Primary — buttons, links, active states
    600: '#5a45d6',
    700: '#4a37b8',
    800: '#3d2e96',
    900: '#2d2270',
    950: '#1a1445',
  },
  accent: {
    50: '#eefff6',
    100: '#d7ffeb',
    200: '#b2ffd9',
    300: '#76ffbe',
    400: '#33f59c',
    500: '#00d97e',   // Success, positive actions
    600: '#00b368',
    700: '#008f54',
    800: '#007044',
    900: '#005c3a',
  },
  surface: {
    50: '#fafaf9',    // Page background
    100: '#f5f5f4',   // Card backgrounds
    200: '#e7e5e4',   // Borders, dividers
    300: '#d6d3d1',   // Disabled states
    400: '#a8a29e',   // Placeholder text
    500: '#78716c',   // Secondary text
    600: '#57534e',   // Body text
    700: '#44403c',   // Headings
    800: '#292524',   // Primary text
    900: '#1c1917',   // Darkest text
  }
}
```

**2. Typography — update `globals.css`:**
```css
/* Import Inter font (the modern SaaS standard) */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

:root {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  
  /* Spacing scale for consistent rhythm */
  --section-gap: 2rem;
  --card-padding: 1.5rem;
  --card-radius: 12px;
  --button-radius: 8px;
  --input-radius: 8px;
}

body {
  font-family: var(--font-sans);
  background-color: #fafaf9;
  color: #292524;
  -webkit-font-smoothing: antialiased;
}

/* Subtle card shadow (Stripe-style) */
.card-shadow {
  box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06);
}

.card-shadow-hover {
  box-shadow: 0 4px 6px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.06);
}
```

**3. Component overrides — update shadcn/ui theme:**

Apply these consistent styles across all shadcn components:

- **Buttons (primary):** `bg-brand-500 hover:bg-brand-600 text-white rounded-lg px-4 py-2.5 font-medium text-sm transition-colors`
- **Buttons (secondary):** `bg-white border border-surface-200 hover:bg-surface-50 text-surface-700 rounded-lg px-4 py-2.5 font-medium text-sm`
- **Buttons (ghost):** `hover:bg-surface-100 text-surface-600 rounded-lg px-4 py-2.5 font-medium text-sm`
- **Cards:** `bg-white rounded-xl border border-surface-200 card-shadow p-6`
- **Inputs:** `border-surface-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 rounded-lg px-3.5 py-2.5 text-sm`
- **Badges (default):** `bg-surface-100 text-surface-600 rounded-full px-2.5 py-0.5 text-xs font-medium`
- **Badges (brand):** `bg-brand-50 text-brand-700 rounded-full px-2.5 py-0.5 text-xs font-medium`
- **Badges (success):** `bg-accent-50 text-accent-700 rounded-full px-2.5 py-0.5 text-xs font-medium`
- **Badges (warning):** `bg-amber-50 text-amber-700 rounded-full px-2.5 py-0.5 text-xs font-medium`
- **Sidebar:** `bg-surface-900 text-white` with `hover:bg-surface-800` for nav items, active item gets `bg-brand-500/20 text-brand-300 border-l-2 border-brand-400`
- **Tables:** Clean with no visible borders between cells, just `border-b border-surface-100` between rows, header row `bg-surface-50 text-surface-500 uppercase text-xs font-medium tracking-wider`

**4. Layout patterns:**

- **Page headers:** Title (text-2xl font-semibold) + subtitle (text-surface-500 text-sm) + action button aligned right
- **Content max-width:** `max-w-7xl mx-auto px-6`
- **Section spacing:** `space-y-8` between major sections
- **Card grids:** `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
- **Stat cards:** Number large (text-3xl font-bold), label small below (text-surface-500 text-sm)
- **Empty states:** Centered illustration area + text + CTA button, inside a dashed border card

**5. FitVector logo treatment:**
- Text logo: "Fit" in font-bold text-brand-500 + "Vector" in font-bold text-surface-800
- Can be rendered as: `<span class="text-brand-500 font-bold">Fit</span><span class="text-surface-800 font-bold">Vector</span>`
- Use text-xl in sidebar, text-2xl on landing page

**6. Apply this design system to ALL existing Phase 1A pages:**
- Landing page
- Login/signup pages
- Onboarding wizard
- Dashboard
- Job search + job detail
- Resume viewer
- Tracker (Kanban board)
- Settings

Every page should feel cohesive — same card styles, same button styles, same spacing patterns. The overall feel should be: clean, spacious, professional, modern. Not flashy — trustworthy.
