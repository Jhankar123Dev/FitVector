import { z } from "zod";

/**
 * A Zod string transformer that:
 * 1. Normalizes Unicode to NFC — handles emoji & multi-byte chars safely
 * 2. Trims leading/trailing whitespace
 *
 * PostgreSQL/Supabase handles UTF-8 natively, but NFC normalization prevents
 * duplicate-looking strings and edge cases with composed vs decomposed chars.
 *
 * Usage:
 *   const schema = z.object({ name: safeString, bio: safeStringMax(500) });
 */
export const safeString = z.string().transform((s) => s.normalize("NFC").trim());

export const safeStringMax = (max: number) =>
  z.string().max(max).transform((s) => s.normalize("NFC").trim());

export const safeStringOptional = z.string().optional().transform((s) =>
  s ? s.normalize("NFC").trim() : s,
);
