/**
 * FitVector Pro — Centralized Recharts Color Palette
 *
 * Single source of truth for all chart inline color props.
 * Values align with the DESIGN.md brand palette:
 *   Primary series  → sky/ocean blue  (#0369a1)
 *   Secondary series → green CTA       (#22c55e)
 *   Neutral infra   → slate scale
 *
 * NOTE: Recharts renders to SVG and requires resolved hex values —
 * CSS variables cannot be passed as inline props. These values are
 * chosen to be legible on both light and dark backgrounds.
 */

export const CHART_COLORS = {
  // ── Primary series ────────────────────────────────────────────────
  primary:   "#0369a1",   // brand-700 / sky blue
  secondary: "#22c55e",   // accent-500 / green CTA
  amber:     "#f59e0b",   // warning amber
  red:       "#ef4444",   // error red
  orange:    "#f97316",   // orange
  sky:       "#0ea5e9",   // brand-500 (lighter blue)

  // ── Funnel — stepped brand-blue scale ─────────────────────────────
  funnel: [
    "#0369a1",  // brand-700
    "#0284c7",  // brand-600
    "#0ea5e9",  // brand-500
    "#38bdf8",  // brand-400
    "#22c55e",  // accent-500
    "#16a34a",  // accent-600
    "#86efac",  // accent-300
  ] as string[],

  // ── Multi-series (radar, comparison overlays) ──────────────────────
  series: [
    "#0369a1",  // brand-700
    "#22c55e",  // accent-500
    "#f59e0b",  // amber
    "#ef4444",  // red
    "#0ea5e9",  // brand-500
  ] as string[],

  // ── Score thresholds (CircularProgress, gauges) ───────────────────
  scoreHigh: "#22c55e",   // >= 80  green
  scoreMid:  "#0369a1",   // >= 60  brand blue (replaces old purple #6c5ce7)
  scoreWarn: "#f59e0b",   // >= 40  amber
  scoreLow:  "#ef4444",   // <  40  red

  // ── Chart infrastructure (grid lines, axis ticks) ─────────────────
  grid:          "#e2e8f0",   // slate-200
  axisTick:      "#64748b",   // slate-500
  axisTickMuted: "#94a3b8",   // slate-400
  svgTrack:      "#e2e8f0",   // SVG circle track background

  // ── Tooltip ───────────────────────────────────────────────────────
  tooltipBorder: "#e2e8f0",   // slate-200
} as const;

export type ChartColors = typeof CHART_COLORS;
